import DirectMessages from "../components/DirectMessages";

type Props = {
  initialContactId?: string;
};

export default function MessagesModule({
  initialContactId,
}: Props) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <DirectMessages mode="job_seeker" initialContactId={initialContactId} />
    </div>
  );
}
