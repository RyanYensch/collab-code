import * as monaco from 'monaco-editor/editor'
import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/definitions/cpp/register'
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker'

declare global {
  interface Window {
    MonacoEnvironment: {
      getWorker(workerId: string, label: string): Worker
    }
  }
}

self.MonacoEnvironment = {
  getWorker(_workerId: string, _label: string) {
    return new EditorWorker()
  },
}

export { monaco }