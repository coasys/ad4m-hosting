import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { Sequelize, Model, DataTypes } from 'sequelize';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite'
});

sequelize.sync();

class User extends Model {}
User.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING
}, { sequelize, modelName: 'user' });

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

app.get('/protected', ensureAuthenticated, (req, res) => {
    res.send('This is a protected route');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});