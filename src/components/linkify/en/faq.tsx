"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "What exactly is DSPilot? What does it replace?",
    answer:
      "DSPilot is a management platform built specifically for Amazon DSP stations. It replaces your Excel files for tracking DWC and IADC scores, your manual exports, your cobbled-together reports and your scattered coaching notes. Everything you currently do in spreadsheets to monitor driver performance, DSPilot centralises and automates.",
  },
  {
    question: "499 or 999\u00A0\u20AC a month sounds expensive. Is it really worth it?",
    answer:
      "A DSP generates between \u00A3400k and \u00A32 million in annual revenue. At 999\u00A0\u20AC per month, DSPilot is less than 0.1% of your turnover. In return, it saves you 3 to 5 hours every week \u2014 that\u2019s 3 full working days a month. It costs less than a part-time driver, and it directly protects your Fantastic tier.",
  },
  {
    question: "Does it work with Amazon's reports?",
    answer:
      "Yes. You copy the driver metrics table straight from your Amazon interface, paste it into DSPilot, and the data is extracted automatically in 30 seconds. No file reformatting, no column adjustments. If Amazon changes their format, we update the import within the day.",
  },
  {
    question: "My station data is sensitive. Is it secure?",
    answer:
      "Absolutely. DSPilot uses Clerk authentication, end-to-end TLS encryption, and hosting on Vercel compliant with European standards. Your driver performance data and IADC metrics are never shared or sold. You remain the owner of everything you import.",
  },
  {
    question: "Can I try it before committing?",
    answer:
      "Yes. The Pro plan is available immediately, and you can cancel in one click at any time. No contract, no minimum term. Judge it on results.",
  },
  {
    question: "What if Amazon changes their metrics or report format?",
    answer:
      "That\u2019s our job to track. DSPilot is continuously maintained and updated. If Amazon modifies the scorecard format or adds new driver performance metrics, we adapt the tool. You don\u2019t have to do anything on your end.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b" style={{ borderColor: "#E8E5DF" }}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-6 text-left font-medium text-[17px] transition-colors duration-200"
        style={{ color: "#1A1A1A" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#2563EB";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#1A1A1A";
        }}
      >
        <span className="pr-4">{question}</span>
        <ChevronDown
          className={cn("size-5 shrink-0 transition-transform duration-300", isOpen && "rotate-180")}
          style={{ color: "#8A8A8A" }}
        />
      </button>
      <div
        className={cn("overflow-hidden transition-all", isOpen ? "max-h-[300px]" : "max-h-0")}
        style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)", transitionDuration: "400ms" }}
      >
        <p className="pb-6 text-[15px] leading-[1.8]" style={{ color: "#4A4A4A" }}>
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="text-center" data-scroll-reveal>
          <p className="mb-3 font-semibold text-[13px] uppercase tracking-[0.1em]" style={{ color: "#2563EB" }}>
            FAQ
          </p>
          <h2
            className="mb-12 font-[family-name:var(--font-display)] leading-[1.15] tracking-[-0.02em]"
            style={{ fontSize: "clamp(32px, 4vw, 48px)", color: "#1A1A1A" }}
          >
            Frequently asked questions
          </h2>
        </div>

        <div className="mx-auto max-w-[800px]" data-scroll-reveal>
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === i}
              onToggle={() => {
                setOpenIndex(openIndex === i ? null : i);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
