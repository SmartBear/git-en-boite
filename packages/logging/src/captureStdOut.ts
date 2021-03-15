export async function captureStdOut(fn: () => Promise<void>): Promise<string[]> {
  const lines: string[] = []
  const original = process.stdout.write
  process.stdout.write = (line: string) => !!lines.push(line)
  try {
    await fn()
    return lines
  } catch (error) {
    throw error
  } finally {
    process.stdout.write = original
  }
}
