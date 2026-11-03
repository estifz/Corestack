import pc from 'picocolors'

export function printBanner(): void {
    const banner = [
        pc.cyan('   ______                 ') +
            pc.blue('_____ __             __  '),
        pc.cyan('  / ____/___  ________   ') +
            pc.blue('/ ___// /_____ ______/ /__'),
        pc.cyan(' / /   / __ \\/ ___/ _ \\  ') +
            pc.blue('\\__ \\/ __/ __ `/ ___/ //_/'),
        pc.cyan('/ /___/ /_/ / /  /  __/ ') +
            pc.blue('___/ / /_/ /_/ / /__/ ,<   '),
        pc.cyan('\\____/\\____/_/   \\___/ ') +
            pc.blue('/____/\\__/\\__,_/\\___/_/|_|  '),
    ].join('\n')

    console.log('\n' + banner + '\n')
    console.log(pc.gray('     Production-ready TypeScript backend starter\n'))
}
