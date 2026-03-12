import concurrently from 'concurrently';

concurrently([
    {
        name: 'server',
        command: 'npm run dev:server',
        cwd: 'server/src',
        prefixColor: 'cyan'
    },
    {
        name: 'client',
        command: 'npm run dev',
        cwd: 'client',
        prefixColor: 'green'
    }
]) 