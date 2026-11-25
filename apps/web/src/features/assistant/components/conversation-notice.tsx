import { FormAlert } from "@/features/auth/components/form-alert"
import { splitMessage } from "../chat-failure"

// Banner DS 1.4b di dalam percakapan, dengan pesan dari peta error dan aksi di bawahnya.
export function ConversationNotice({
  message,
  children,
  ref,
}: {
  message: string
  children?: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}) {
  const { title, body } = splitMessage(message)
  return (
    <div className="flex max-w-lg flex-col gap-3">
      <FormAlert tone="info" title={title} ref={ref}>
        {body}
      </FormAlert>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
