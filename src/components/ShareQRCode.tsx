import { useState } from 'react'
import type { SurgicalCase } from '../types/case'

interface ShareQRCodeProps {
  surgicalCase: SurgicalCase
}

export function ShareQRCode({ surgicalCase }: ShareQRCodeProps) {
  const [showModal, setShowModal] = useState(false)

  // Encode case data as URL query param (simple compression with base64)
  const encodedData = btoa(JSON.stringify(surgicalCase))
  const shareUrl = `${window.location.origin}?import=${encodedData}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    alert('คัดลอกลิงก์แล้ว!')
  }

  return (
    <>
      <button
        type="button"
        className="btn-share-qr"
        onClick={() => setShowModal(true)}
        title="แบ่งปันเป็น QR Code"
      >
        📲 แบ่งปัน
      </button>

      {showModal && (
        <div className="share-qr-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="share-qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-qr-modal__header">
              <h3>แบ่งปัน "{surgicalCase.title}"</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="share-qr-modal__body">
              {/* QR Code */}
              <div className="share-qr__qr">
                <img src={qrCodeUrl} alt="QR Code" />
                <p className="share-qr__hint">
                  สแกน QR code เพื่อนำเข้าเคส
                </p>
              </div>

              {/* Share link */}
              <div className="share-qr__link">
                <label>ลิงก์แบ่งปัน:</label>
                <div className="share-qr__link-box">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="share-qr__link-input"
                  />
                  <button
                    type="button"
                    className="btn-copy-link"
                    onClick={handleCopyLink}
                  >
                    คัดลอก
                  </button>
                </div>
              </div>

              {/* Social share */}
              <div className="share-qr__social">
                <p>แบ่งปันใน:</p>
                <div className="share-qr__social-buttons">
                  <a
                    href={`https://line.me/R/msg/0?${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-social btn-social--line"
                  >
                    LINE
                  </a>
                  <button
                    type="button"
                    className="btn-social btn-social--copy"
                    onClick={() => {
                      navigator.share?.({
                        title: surgicalCase.title,
                        text: `ดูเคส: ${surgicalCase.title}`,
                        url: shareUrl,
                      }).catch(() => {/* fallback */})
                    }}
                  >
                    แบ่งปัน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
