import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { Sequelize, Model, DataTypes } from 'sequelize';
import Docker from 'dockerode';
import getPort from 'get-port';
import { execSync } from 'child_process';

const docker = new Docker();

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

sequelize.sync();

class User extends Model {
    declare id: number;
    declare email: string;
    declare password: string;
 }
User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
}, { sequelize, modelName: 'user' });

class Service extends Model {
    declare userId: number;
    declare serviceId: string;
    declare port: number;
    declare paused: boolean;
}
Service.init({
    userId: DataTypes.INTEGER,
    serviceId: DataTypes.STRING,
    port: DataTypes.INTEGER,
    paused: DataTypes.BOOLEAN,
}, { sequelize, modelName: 'service' });

User.hasMany(Service, { foreignKey: 'userId' });
Service.belongsTo(User, { foreignKey: 'userId' });

passport.use(new LocalStrategy({ usernameField: 'email' },
    async (email, password, done) => {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return done(null, false, { message: 'Incorrect email.' });
        }
        if (!bcrypt.compareSync(password, user.dataValues.password)) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    }
));

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    const user = await User.findByPk(id);
    done(null, user);
});

app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.post('/login',
    passport.authenticate('local', { failureMessage: true }),
    (req, res) => {
        res.send('Login success');
    }
);

app.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).send({ message: 'Email is already taken.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    const user = await User.create({ email, password: hashedPassword });

    req.login(user, err => {
        if (err) {
            return res.status(500).send({ message: 'Error logging in.' });
        }
        return res.send({ message: 'Signup successful.' });
    });
});

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.post('/service/create', ensureAuthenticated, async (req, res) => {
    // @ts-ignore
    const service = await Service.findOne({ where: { userId: req.user.id } });

    
    if (service) {
        if (service.paused) {
            res.status(400).send({ message: 'Service already exists but paused.' });
        } else {
            res.status(400).send({ message: 'Service already exists for the user.' });
        }
    } else {
        const port = await getPort();
        const service = await docker.createService({
            Name: "my-service",
            Mode: {
                Replicated: {
                    Replicas: 1
                }
            },
            TaskTemplate: {
                ContainerSpec: {
                    Image: "ad4m-hosting-image"
                }
            },
            EndpointSpec: {
                Ports: [
                    {
                        TargetPort: 12000,
                        PublishedPort: port
                    }
                ]
            }
        });

        await Service.create({
            // @ts-ignore
            userId: req.user.id,
            serviceId: service.id,
            port: port,
            paused: false
        });

        res.send(`Service created with ID: ${service.id}`);
    }
});

app.get('/service/info', ensureAuthenticated, async (req, res) => {
    // @ts-ignore
    const service = await Service.findOne({ where: { userId: req.user.id } });

    if (!service) {
        res.status(404).send({ message: 'No service found for the user.' });
    } else {
        res.send(service);
    }
});

app.delete('/service/delete', ensureAuthenticated, async (req, res) => {
    // @ts-ignore
    const service = await Service.findOne({ where: { userId: req.user.id } });

    if (!service) {
        res.status(404).send({ message: 'No service found for the user.' });
    } else {
        const dockerService = docker.getService(service.serviceId);

        await dockerService.remove();

        await service.destroy();

        res.send(`Service with ID: ${service.serviceId} removed`);
    }
})

app.put('/service/toggle', ensureAuthenticated, async (req, res) => {
    // @ts-ignore
    const service = await Service.findOne({ where: { userId: req.user.id } });

    if (!service) {
        res.status(404).send({ message: 'No service found for the user.' });
    } else {
        const dockerService = docker.getService(service.serviceId);

        const serviceInfo = await dockerService.inspect();

        const { Replicas } = serviceInfo.Spec.Mode.Replicated;

        const replicas = Replicas === 1 ? 0 : 1;

        execSync(`docker service update --replicas ${replicas} ${service.serviceId}`);
        
        await Service.update({ paused: !Replicas }, { where: { serviceId: service.serviceId } });

        res.send(`Service with ID: ${service.serviceId} toggled`);
    }
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});