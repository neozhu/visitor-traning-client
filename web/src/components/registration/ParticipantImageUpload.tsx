import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Button, SpinLoading } from 'antd-mobile'
import { t, translateMessage } from '../../i18n'
import { api } from '../../domain/apiClient'
import { baseData } from '../../domain/apiCatalog'
import type { UploadedFile } from '../../domain/apiTypes'

export function ParticipantImageUpload({ attachment, file, onChange, onBusyChange }: {
  attachment?: UploadedFile
  file?: File
  onChange: (attachment?: UploadedFile, file?: File) => void
  onBusyChange: (busy: boolean) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const active = useRef(true)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const rules = baseData().attachmentRules
  const accept = rules.allowedContentTypes.filter(type => ['image/jpeg', 'image/png'].includes(type)).join(',')
  const enabled = rules.maxFilesPerParticipant > 0 && !!accept
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected || pending.current) return
    setError('')
    if (!enabled) { setError('当前配置暂不允许上传图片'); return }
    if (!['image/jpeg', 'image/png'].includes(selected.type) || !rules.allowedContentTypes.includes(selected.type)) { setError('仅支持 JPEG 或 PNG 图片'); return }
    if (!selected.size || selected.size > rules.maxSizeBytes) { setError('图片大小不符合要求'); return }
    pending.current = true
    setBusy(true)
    onBusyChange(true)
    try {
      const image = await createImageBitmap(selected).catch(() => { throw new Error('请选择有效的 JPEG 或 PNG 图片') })
      image.close()
      if (!active.current) return
      const body = new FormData()
      body.append('file', selected)
      const uploaded = await api.request<UploadedFile>('/participant-attachments', { method: 'POST', body })
      if (active.current) onChange(uploaded, selected)
    } catch (error) {
      if (active.current) setError(error instanceof Error ? error.message : '附件上传失败，请重试')
    } finally {
      pending.current = false
      if (active.current) { setBusy(false); onBusyChange(false) }
    }
  }

  return <div className="participant-image-field" aria-busy={busy}>
    <input ref={input} type="file" accept={accept || 'image/jpeg,image/png'} hidden aria-label={t('选择人员图片')} onChange={upload} disabled={busy || !enabled} />
    <button type="button" className="participant-image-upload" disabled={busy || !enabled} onClick={() => input.current?.click()} aria-label={t(attachment ? '更换图片' : '拍照上传')}>
      {preview ? <img className="participant-image-preview" src={preview} alt={t('人员图片预览')} /> : <img className="participant-image-watermark" src="/assets/id-upload.svg" alt="" />}
      <span>{busy ? <><SpinLoading color="primary" />{t('正在上传图片')}</> : t(attachment ? '更换图片' : '拍照上传')}</span>
    </button>
    {!enabled && <p className="muted small">{t('当前配置暂不允许上传图片')}</p>}
    {attachment && <div className="participant-image-details"><span>{attachment.fileName}</span><Button size="small" fill="none" color="danger" disabled={busy} onClick={() => { setError(''); onChange() }}>{t('移除图片')}</Button></div>}
    {attachment && Date.parse(attachment.expiresAt) <= api.now() && <p className="field-error">{t('附件已到期，请重新上传')}</p>}
    {error && <p className="field-error" role="alert">{translateMessage(error)}</p>}
  </div>
}
