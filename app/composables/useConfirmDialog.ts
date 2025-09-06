import { ref, reactive, h, render, createApp, type Component } from 'vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

export interface ConfirmDialogOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger' | 'warning' | 'info'
  icon?: string | Component
  requireTextVerification?: boolean
  verificationText?: string
  autoFocus?: 'confirm' | 'cancel'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

export interface ConfirmDialogInstance {
  confirm: () => void
  cancel: () => void
  close: () => void
}

// Global dialog state
const dialogQueue: ConfirmDialogOptions[] = []
const currentDialog = ref<ConfirmDialogOptions | null>(null)
const isDialogOpen = ref(false)
const isDialogLoading = ref(false)

export function useConfirmDialog() {
  
  const showDialog = (options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const dialogOptions: ConfirmDialogOptions = {
        ...options,
        onConfirm: async () => {
          isDialogLoading.value = true
          try {
            if (options.onConfirm) {
              await options.onConfirm()
            }
            resolve(true)
            closeCurrentDialog()
          } catch (error) {
            // Keep dialog open on error
            isDialogLoading.value = false
            throw error
          }
        },
        onCancel: () => {
          if (options.onCancel) {
            options.onCancel()
          }
          resolve(false)
          closeCurrentDialog()
        }
      }
      
      if (isDialogOpen.value) {
        // Queue dialog if one is already open
        dialogQueue.push(dialogOptions)
      } else {
        showDialogInternal(dialogOptions)
      }
    })
  }
  
  const showDialogInternal = (options: ConfirmDialogOptions) => {
    currentDialog.value = options
    isDialogOpen.value = true
    isDialogLoading.value = false
    
    // Mount dialog component if not already mounted
    mountDialogComponent()
  }
  
  const closeCurrentDialog = () => {
    isDialogOpen.value = false
    currentDialog.value = null
    isDialogLoading.value = false
    
    // Show next dialog in queue if any
    if (dialogQueue.length > 0) {
      const nextDialog = dialogQueue.shift()
      if (nextDialog) {
        setTimeout(() => showDialogInternal(nextDialog), 200)
      }
    }
  }
  
  const confirmDelete = (itemName: string, onConfirm?: () => void | Promise<void>): Promise<boolean> => {
    return showDialog({
      title: `Delete ${itemName}?`,
      message: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
      requireTextVerification: true,
      verificationText: 'DELETE',
      autoFocus: 'cancel',
      onConfirm
    })
  }
  
  const confirmAction = (
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> => {
    return showDialog({
      title,
      message,
      onConfirm
    })
  }
  
  const confirmDanger = (
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> => {
    return showDialog({
      title,
      message,
      variant: 'danger',
      confirmLabel: 'Proceed',
      autoFocus: 'cancel',
      onConfirm
    })
  }
  
  const confirmWarning = (
    title: string,
    message: string,
    onConfirm?: () => void | Promise<void>
  ): Promise<boolean> => {
    return showDialog({
      title,
      message,
      variant: 'warning',
      onConfirm
    })
  }
  
  return {
    showDialog,
    confirmDelete,
    confirmAction,
    confirmDanger,
    confirmWarning,
    isDialogOpen,
    isDialogLoading,
    currentDialog
  }
}

// Mount dialog component globally (singleton pattern)
let dialogApp: any = null
let dialogContainer: HTMLElement | null = null

function mountDialogComponent() {
  if (!dialogApp && typeof window !== 'undefined') {
    // Create container
    dialogContainer = document.createElement('div')
    dialogContainer.id = 'confirm-dialog-container'
    document.body.appendChild(dialogContainer)
    
    // Create and mount Vue app with dialog
    dialogApp = createApp({
      setup() {
        return {
          isOpen: isDialogOpen,
          loading: isDialogLoading,
          options: currentDialog
        }
      },
      render() {
        if (!this.options) return null
        
        return h(ConfirmationDialog, {
          open: this.isOpen,
          title: this.options.title,
          message: this.options.message,
          confirmLabel: this.options.confirmLabel,
          cancelLabel: this.options.cancelLabel,
          variant: this.options.variant,
          icon: this.options.icon,
          loading: this.loading,
          requireTextVerification: this.options.requireTextVerification,
          verificationText: this.options.verificationText,
          autoFocus: this.options.autoFocus,
          'onUpdate:open': (value: boolean) => {
            if (!value && this.options?.onCancel) {
              this.options.onCancel()
            }
          },
          onConfirm: () => {
            if (this.options?.onConfirm) {
              this.options.onConfirm()
            }
          },
          onCancel: () => {
            if (this.options?.onCancel) {
              this.options.onCancel()
            }
          }
        })
      }
    })
    
    dialogApp.mount(dialogContainer)
  }
}

// Cleanup on unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (dialogApp) {
      dialogApp.unmount()
      dialogApp = null
    }
    if (dialogContainer) {
      document.body.removeChild(dialogContainer)
      dialogContainer = null
    }
  })
}