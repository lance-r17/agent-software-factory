const ISSUE_URL = 'https://github.com/lance-r17/agent-software-factory/issues/new'
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+$/

export function normalizeGithubRepository(value: string): string | null {
  let input = value.trim()
  if (!input) return null
  if (/^(?:www\.)?github\.com\//i.test(input)) input = `https://${input}`

  try {
    const url = new URL(input)
    const hostname = url.hostname.toLowerCase()
    if (!['https:', 'http:'].includes(url.protocol)) return null
    if (hostname !== 'github.com' && hostname !== 'www.github.com') return null
    if (url.username || url.password || url.port) return null

    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length !== 2) return null
    const [owner, rawRepository] = parts
    const repository = rawRepository.replace(/\.git$/i, '')
    if (!OWNER_PATTERN.test(owner) || !REPOSITORY_PATTERN.test(repository)) return null
    if (repository === '.' || repository === '..') return null

    return `https://github.com/${owner}/${repository}`
  } catch {
    return null
  }
}

export function buildFastTrackIssueUrl(repositoryUrl: string): string | null {
  const repository = normalizeGithubRepository(repositoryUrl)
  if (!repository) return null

  const issueUrl = new URL(ISSUE_URL)
  const body = [
    '### 仓库 URL',
    repository,
    '',
    '### 许可证文件证据（可选）',
    '无',
    '',
    '### 补充说明（可选）',
    '无',
    '',
    '---',
    '由 GitHub Pages Fast Track 入口生成。提交不代表入池，仍需完成官方仓库、归档状态、许可证与重复候选检查。',
  ].join('\n')
  issueUrl.searchParams.set('title', `[Fast Track] ${repository.split('/').slice(-2).join('/')}`)
  issueUrl.searchParams.set('body', body)
  issueUrl.searchParams.set('labels', 'candidate:fast-track,status:queued')
  return issueUrl.toString()
}
