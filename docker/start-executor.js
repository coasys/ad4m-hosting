const { ChildProcess, exec, ExecException, execSync } = require("node:child_process");
const path = require("node:path");

async function runExecutor() {
    // const command = path.resolve('docker', 'ad4m-executor');
    const command = path.resolve('ad4m-executor');

    let executorProcess = null;
    execSync(`${command} init`, {cwd: process.cwd()})

    console.log("Starting executor")

    const adminCredential = "admin"

    executorProcess = exec(`${command} run --admin-credential ${adminCredential} --gql-port 12000 --localhost false`, {})
    
    let executorReady = new Promise((resolve, reject) => {
        executorProcess.stdout.on('data', (data) => {
            if (data.includes(`listening on http://127.0.0.1:${4000}`)) {
                resolve()
            }
        });
        executorProcess.stderr.on('data', (data) => {
            if (data.includes(`listening on http://127.0.0.1:${4000}`)) {
                resolve()
            }
        });
    })

    executorProcess.stdout.on('data', (data) => {
        console.log(`${data}`);
    });
    executorProcess.stderr.on('data', (data) => {
        console.log(`${data}`);
    });

    console.log("Waiting for executor to settle...")
    await executorReady
    return executorProcess;
}

runExecutor()