import { Mail, Linkedin, ExternalLink } from "lucide-react";

export function AboutSection() {
  return (
    <div className="board rounded-xl p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Built by
      </h3>
      <p className="mt-1 text-lg font-semibold text-foreground">Tony Wang</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <a
          href="mailto:tywg18.na@gmail.com"
          className="inline-flex items-center gap-1.5 text-secondary hover:underline"
        >
          <Mail className="h-3.5 w-3.5" />
          tywg18.na@gmail.com
        </a>
        <a
          href="https://www.linkedin.com/in/tonywang-br/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-secondary hover:underline"
        >
          <Linkedin className="h-3.5 w-3.5" />
          LinkedIn
        </a>
      </div>

      <hr className="my-4 border-border/60" />

      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        About PM Accelerator
      </h3>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          The Product Manager Accelerator Program is designed to support PM professionals through
          every stage of their careers. From students looking for entry-level jobs to Directors
          looking to take on a leadership role, this program has helped hundreds of students fulfill
          their career aspirations.
        </p>
        <p>
          The Product Manager Accelerator community of PM Accelerator is ambitious and committed.
          Through structured training, and a supportive community, PM Accelerator empowers their
          members to fast-track their PM careers and become confident, capable product leaders.
        </p>
        <p>
          PM Accelerator is also committed to educational fairness — offering free Product Management
          education to teenagers from underserved families, with the goal of establishing 200 schools
          worldwide over the next 20 years.
        </p>
      </div>

      <a
        href="https://www.pmaccelerator.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
      >
        source: pmaccelerator.io
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
