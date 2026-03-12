import concurrently from 'concurrently';

concurrently([
    {
        name: 'client',
        command: 'npm run dev',
        cwd: 'client',
        prefixColor: 'green'
    }
]) 