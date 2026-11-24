import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Link2, ShieldCheck } from 'lucide-react'
import { buildFastTrackIssueUrl } from '../lib/repositorySubmission'
import type { Locale } from '../locale'

const content = {
  zh: {
    kicker: 'FAST TRACK · CANDIDATE INTAKE',
    title: '发现一个值得拆解的项目？',
    intro: '只贴一个 GitHub 仓库 URL。页面会生成预填的候选 Issue，后续合规检查与审核记录围绕同一 Issue 展开。',
    steps: ['粘贴仓库 URL', '在 GitHub 确认创建 Issue', '等待合规审核与结果评论'],
    formKicker: 'ONE URL · NO BACKEND',
    formTitle: '候选项目快速提交',
    label: 'GitHub 仓库 URL',
    placeholder: 'https://github.com/owner/repository',
    submit: '前往 GitHub 提交',
    hint: '需要 GitHub 账号，并在打开的页面点击 Create issue。此页面不会保存你的 URL。',
    error: '请输入有效的 GitHub 仓库根地址，例如 https://github.com/owner/repository。',
    handoff: '提交链接已生成。若新标签页未打开，请',
    handoffLink: '继续前往 GitHub',
    compliance: '提交不等于入池：官方仓库、归档状态、许可证与重复候选检查保持不变。',
  },
  en: {
    kicker: 'FAST TRACK · CANDIDATE INTAKE',
    title: 'Found a project worth examining?',
    intro: 'Paste one GitHub repository URL. We will prepare a pre-filled candidate Issue, with compliance checks and review records attached to the same thread.',
    steps: ['Paste the repository URL', 'Confirm the Issue on GitHub', 'Watch for compliance review and results'],
    formKicker: 'ONE URL · NO BACKEND',
    formTitle: 'Submit a candidate',
    label: 'GitHub repository URL',
    placeholder: 'https://github.com/owner/repository',
    submit: 'Continue to GitHub',
    hint: 'A GitHub account is required. Select Create issue on the page that opens. This site does not store your URL.',
    error: 'Enter a valid GitHub repository root URL, such as https://github.com/owner/repository.',
    handoff: 'Your submission link is ready. If no new tab opened,',
    handoffLink: 'continue to GitHub',
    compliance: 'Submission is not admission: official-repository, archive, license, and duplicate checks remain unchanged.',
  },
}

export default function CandidateSubmission({ locale }: { locale: Locale }) {
  const c = content[locale]
  const [repository, setRepository] = useState('')
  const [error, setError] = useState('')
  const [handoffUrl, setHandoffUrl] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const issueUrl = buildFastTrackIssueUrl(repository)
    if (!issueUrl) {
      setError(c.error)
      setHandoffUrl('')
      return
    }

    setError('')
    setHandoffUrl(issueUrl)
    window.open(issueUrl, '_blank', 'noopener,noreferrer')
  }

  return <section className="submission-section page-width" id="submit" aria-labelledby="submission-title">
    <div className="submission-copy">
      <span className="hand-label">{c.kicker}</span>
      <h2 id="submission-title">{c.title}</h2>
      <p>{c.intro}</p>
      <ol className="submission-steps">
        {c.steps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, '0')}</span>{step}</li>)}
      </ol>
    </div>

    <div className="submission-box">
      <span className="hand-label">{c.formKicker}</span>
      <h3>{c.formTitle}</h3>
      <form className="submission-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor={`repository-url-${locale}`}>{c.label}</label>
        <div className="repository-input">
          <Link2 size={20} aria-hidden="true" />
          <input
            id={`repository-url-${locale}`}
            name="repository"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={repository}
            placeholder={c.placeholder}
            aria-describedby={`repository-hint-${locale}`}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setRepository(event.target.value)
              setError('')
              setHandoffUrl('')
            }}
          />
        </div>
        {error && <p className="submission-error" role="alert">{error}</p>}
        <button className="submission-submit" type="submit">{c.submit}<ArrowUpRight size={18} /></button>
        <p className="submission-hint" id={`repository-hint-${locale}`}>{c.hint}</p>
      </form>
      {handoffUrl && <p className="submission-handoff" role="status">
        {c.handoff} <a href={handoffUrl} target="_blank" rel="noreferrer">{c.handoffLink}<ArrowUpRight size={14} /></a>
      </p>}
      <p className="submission-compliance"><ShieldCheck size={17} aria-hidden="true" />{c.compliance}</p>
    </div>
  </section>
}
