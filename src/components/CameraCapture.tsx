import { Camera, CircleAlert, ImageUp, RefreshCw, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { cx } from './ui'

type Facing = 'environment' | 'user'

/** Phones and tablets use their own camera app, which focuses and handles light better than a web page */
const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const hasCamera = () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

/**
 * Box that takes a fresh photo with the camera:
 * - phones open the camera straight away (back camera for documents, front camera for selfies)
 * - computers open a camera window inside the page
 * - if there is no camera or it is blocked, the user can upload a photo instead
 */
export function PhotoCapture({
  title,
  name,
  icon: Icon = Camera,
  facing = 'environment',
  onFile,
}: {
  title: string
  /** file name for the captured photo, e.g. "id-front" */
  name: string
  icon?: LucideIcon
  facing?: Facing
  onFile: (file: File | null) => void
}) {
  const { t } = useTranslation()
  const cameraInput = useRef<HTMLInputElement>(null)
  const uploadInput = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string>()

  // Free the preview image's memory when it changes or the box goes away
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const choose = (file: File | null) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }

  const start = () => {
    if (isTouchDevice()) cameraInput.current?.click()
    else if (hasCamera()) setOpen(true)
    else uploadInput.current?.click()
  }

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    choose(e.target.files?.[0] ?? null)
    e.target.value = '' // lets the same photo be picked again after a retake
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={cx(
          'press group flex w-full items-center gap-4 rounded-[20px] border-[1.5px] border-dashed bg-white p-4 text-start hover:border-gold hover:bg-gold-tint/30',
          preview ? 'border-success bg-success/5' : 'border-line',
        )}
      >
        {preview ? (
          <img src={preview} alt="" className="animate-pop h-[72px] w-[104px] shrink-0 rounded-[12px] object-cover shadow-l1" />
        ) : (
          <span className="grid h-[72px] w-[104px] shrink-0 place-items-center rounded-[12px] bg-gold-tint text-[#a8884a] transition-colors group-hover:bg-gold group-hover:text-ink">
            <Icon size={30} strokeWidth={1.8} aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">{title}</span>
          <span className={cx('mt-1 inline-flex items-center gap-1.5 text-[12px] font-semibold', preview ? 'text-success' : 'text-[#8a6d33]')}>
            {preview ? <RefreshCw size={13} aria-hidden /> : <Camera size={14} aria-hidden />}
            {preview ? t('camera.retake') : t('camera.open')}
          </span>
        </span>
      </button>

      {/* capture= opens the camera directly on phones instead of the photo gallery */}
      <input ref={cameraInput} type="file" accept="image/*" capture={facing} hidden onChange={pick} />
      <input ref={uploadInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic" hidden onChange={pick} />

      {open && (
        <CameraWindow
          title={title}
          name={name}
          facing={facing}
          onClose={() => setOpen(false)}
          onPhoto={(file) => {
            choose(file)
            setOpen(false)
          }}
          onUploadInstead={() => {
            setOpen(false)
            uploadInput.current?.click()
          }}
        />
      )}
    </>
  )
}

type CameraState = { step: 'starting' } | { step: 'live' } | { step: 'taken'; url: string; file: File } | { step: 'error'; reason: 'denied' | 'none' }

function CameraWindow({
  title,
  name,
  facing,
  onClose,
  onPhoto,
  onUploadInstead,
}: {
  title: string
  name: string
  facing: Facing
  onClose: () => void
  onPhoto: (file: File) => void
  onUploadInstead: () => void
}) {
  const { t } = useTranslation()
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const [state, setState] = useState<CameraState>({ step: 'starting' })
  const selfie = facing === 'user'

  const stop = () => {
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
  }

  const startCamera = async () => {
    setState({ step: 'starting' })
    try {
      stop()
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      if (video.current) {
        video.current.srcObject = stream.current
        await video.current.play()
      }
      setState({ step: 'live' })
    } catch (error) {
      const denied = (error as DOMException)?.name === 'NotAllowedError' || (error as DOMException)?.name === 'SecurityError'
      setState({ step: 'error', reason: denied ? 'denied' : 'none' })
    }
  }

  useEffect(() => {
    startCamera()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Free the photo's memory when it is replaced
  useEffect(() => () => {
    if (state.step === 'taken') URL.revokeObjectURL(state.url)
  }, [state])

  const takePhoto = () => {
    const el = video.current
    if (!el || !el.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = el.videoWidth
    canvas.height = el.videoHeight
    canvas.getContext('2d')!.drawImage(el, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `${name}.jpg`, { type: 'image/jpeg' })
        setState({ step: 'taken', url: URL.createObjectURL(blob), file })
      },
      'image/jpeg',
      0.92,
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="animate-rise w-full max-w-[640px] overflow-hidden rounded-[24px] bg-night text-white shadow-l4">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[16px] font-bold">{title}</h2>
          <button onClick={onClose} aria-label={t('camera.cancel')} className="press grid size-9 place-items-center rounded-full hover:bg-white/10">
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="relative aspect-[4/3] bg-black">
          {/* the live video stays mounted so the camera keeps running behind a retake */}
          <video
            ref={video}
            playsInline
            muted
            className={cx('absolute inset-0 size-full object-cover', selfie && '-scale-x-100', state.step !== 'live' && 'invisible')}
          />
          {state.step === 'taken' && <img src={state.url} alt="" className="absolute inset-0 size-full object-cover" />}

          {state.step === 'live' && (
            <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
              {selfie ? (
                <span className="h-[72%] w-[46%] rounded-[50%] border-[3px] border-dashed border-gold/90 shadow-[0_0_0_2000px_rgb(0_0_0/0.35)]" />
              ) : (
                <span className="aspect-[1.586] w-[78%] rounded-[16px] border-[3px] border-dashed border-gold/90 shadow-[0_0_0_2000px_rgb(0_0_0/0.35)]" />
              )}
            </div>
          )}

          {state.step === 'starting' && (
            <div className="absolute inset-0 grid place-items-center text-[13px] text-white/70">
              <span className="flex items-center gap-2">
                <span className="size-5 animate-spin rounded-full border-2 border-gold/30 border-t-gold" /> {t('camera.starting')}
              </span>
            </div>
          )}

          {state.step === 'error' && (
            <div className="absolute inset-0 grid place-items-center p-8 text-center">
              <div>
                <CircleAlert size={36} className="mx-auto text-warning" aria-hidden />
                <p className="mt-3 text-[14px] leading-relaxed text-white/80">{t(state.reason === 'denied' ? 'camera.denied' : 'camera.none')}</p>
              </div>
            </div>
          )}
        </div>

        <p className="px-5 pt-3 text-center text-[12px] text-white/60">{t(selfie ? 'camera.hintSelfie' : 'camera.hintId')}</p>

        <div className="grid gap-2 p-5 pt-3">
          {state.step === 'taken' ? (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setState({ step: 'live' })} className="press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border border-white/20 text-[14px] font-bold hover:bg-white/10">
                <RefreshCw size={17} aria-hidden /> {t('camera.retake')}
              </button>
              <button onClick={() => onPhoto(state.file)} className="press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-gold text-[14px] font-bold text-ink hover:bg-gold-light">
                {t('camera.use')}
              </button>
            </div>
          ) : state.step === 'error' ? (
            state.reason === 'denied' && (
              <button onClick={startCamera} className="press inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-gold text-[14px] font-bold text-ink hover:bg-gold-light">
                <RefreshCw size={17} aria-hidden /> {t('camera.tryAgain')}
              </button>
            )
          ) : (
            <button
              onClick={takePhoto}
              disabled={state.step !== 'live'}
              className="press inline-flex min-h-[52px] items-center justify-center gap-2 rounded-[14px] bg-gold text-[15px] font-bold text-ink hover:bg-gold-light disabled:opacity-50"
            >
              <Camera size={19} aria-hidden /> {t('camera.take')}
            </button>
          )}
          <button onClick={onUploadInstead} className="press inline-flex items-center justify-center gap-1.5 rounded-[12px] py-2 text-[12px] font-semibold text-white/60 hover:text-white">
            <ImageUp size={15} aria-hidden /> {t('camera.upload')}
          </button>
        </div>
      </div>
    </div>
  )
}
