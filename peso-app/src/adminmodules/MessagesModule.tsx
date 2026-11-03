import DirectMessages from "../components/DirectMessages";
import type { MessageMode } from "../components/DirectMessages";

type Props = {
  mode?: MessageMode;
  canDecideApplications?: boolean;
};

export default function MessagesModule({
  mode = "admin",
  canDecideApplications = mode === "admin",
}: Props) {
  return (
    <DirectMessages
      mode={mode}
      canDecideApplications={canDecideApplications}
    />
  );
}
