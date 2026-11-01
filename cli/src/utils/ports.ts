import net from 'node:net'

export function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer()
        server.once('error', () => resolve(false))
        server.once('listening', () => {
            server.close(() => resolve(true))
        })
        server.listen(port, '0.0.0.0')
    })
}

export async function findAvailablePort(
    preferredPort: number,
): Promise<number> {
    let port = preferredPort
    while (!(await isPortAvailable(port))) {
        port++
    }
    return port
}
