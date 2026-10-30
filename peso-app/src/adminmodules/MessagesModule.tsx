import DirectMessages from "../components/DirectMessages";
import type { MessageMode } from "../components/DirectMessages";

type Props = {
  mode?: MessageMode;
};

export default function MessagesModule({ mode = "admin" }: Props) {
  return <DirectMessages mode={mode} />;
}