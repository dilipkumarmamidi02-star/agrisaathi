export default function GrievanceMarquee() {
  return (
    <div className="w-full overflow-hidden bg-amber-50 border-y border-amber-200 py-1">
      <div
        className="whitespace-nowrap animate-marquee text-sm text-amber-800"
        style={{
          animation: "marquee 18s linear infinite"
        }}
      >
        For any problem with a lot, offer, logistics, cold storage, or your
        account, please email&nbsp;

        <a
          href="mailto:agrisaathiteamapex@gmail.com"
          className="underline font-medium"
        >
          agrisaathiteamapex@gmail.com
        </a>

        &nbsp;or raise a grievance from the Grievances page — our support team
        and admin will review and respond.
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }

          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
