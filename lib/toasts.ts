import toast from 'react-hot-toast'

export function showSuccess(message: string) {
  toast.success(message, {
    iconTheme: { primary: '#0071e3', secondary: '#f5f5f7' },
    style: { borderLeft: '3px solid #0071e3' },
  })
}

export function showError(message: string) {
  toast.error(message, {
    duration: 5000,
    iconTheme: { primary: '#e63e3e', secondary: '#f5f5f7' },
    style: { borderLeft: '3px solid #e63e3e' },
  })
}
