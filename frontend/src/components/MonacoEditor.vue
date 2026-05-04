<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

// Tell Monaco how to spin up its language workers when bundled by Vite.
// Using ?worker imports lets each language be a separate chunk loaded on
// demand. JSON is the only language we currently care about.
;(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') return new jsonWorker()
    return new editorWorker()
  },
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    language?: string
    readOnly?: boolean
    placeholder?: string
    height?: string
  }>(),
  {
    language: 'json',
    readOnly: false,
    placeholder: '',
    height: '600px',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}>()

const container = ref<HTMLDivElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (!container.value) return

  // Monaco's JSON language defaults already include syntax validation
  // (red squiggles for malformed JSON). We don't ship the ES query DSL
  // schema, so no schema-driven diagnostics are wired up here.

  editor = monaco.editor.create(container.value, {
    value: props.modelValue,
    language: props.language,
    readOnly: props.readOnly,
    automaticLayout: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: 'ui-monospace, "Cascadia Mono", "Source Code Pro", monospace',
    folding: true,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    tabSize: 2,
    formatOnPaste: true,
    bracketPairColorization: { enabled: true },
  })

  editor.onDidChangeModelContent(() => {
    if (editor) emit('update:modelValue', editor.getValue())
  })

  // Ctrl/Cmd+Enter to send. Monaco's CommandId enum exposes these directly.
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => emit('submit'))
})

onBeforeUnmount(() => {
  editor?.dispose()
  editor = null
})

// Mirror prop changes from parent into the editor (used when a history item
// is loaded into the body, or after format).
watch(
  () => props.modelValue,
  (next) => {
    if (editor && editor.getValue() !== next) editor.setValue(next)
  },
)

watch(
  () => props.readOnly,
  (next) => {
    editor?.updateOptions({ readOnly: next })
  },
)

defineExpose({
  format: () => editor?.getAction('editor.action.formatDocument')?.run(),
  focus: () => editor?.focus(),
})
</script>

<template>
  <div ref="container" class="monaco-host" :style="{ height }" />
</template>

<style scoped>
.monaco-host {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
}
</style>
