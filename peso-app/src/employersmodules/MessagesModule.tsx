import DirectMessages from "../components/DirectMessages";

export default function MessagesModule({
  initialContactId,
}: {
  initialContactId?: string;
}) {
  return <DirectMessages mode="employer" initialContactId={initialContactId} />;
}