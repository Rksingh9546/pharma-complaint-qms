import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Section1Origin from "../components/complaint/Section1Origin";
import Section2Product from "../components/complaint/Section2Product";
import Section3Details from "../components/complaint/Section3Details";
import Section4Assessment from "../components/complaint/Section4Assessment";

import AIAssistantPanel from "../components/ai/AIAssistantPanel";
import RiskAssessmentPanel from "../components/ai/RiskAssessmentPanel";
import CompletenessPanel from "../components/ai/CompletenessPanel";
import DuplicatePanel from "../components/ai/DuplicatePanel";

import { checkDuplicates } from "../store/slices/aiSlice";

export default function ComplaintIntakePage() {
  const dispatch = useDispatch();
  const analysis = useSelector((state) => state.ai.analysis);

  // When a new analysis is available, check for possible duplicates.
  useEffect(() => {
    if (analysis) {
      dispatch(checkDuplicates());
    }
  }, [analysis, dispatch]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          New Complaint
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Enter complaint details or use the AI assistant to extract them.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        {/* LEFT: Complaint form */}
        <div className="order-last space-y-6 lg:order-none lg:col-span-2">
          <div className="card divide-y divide-slate-200">
            <Section1Origin />
            <Section2Product />
            <Section3Details />
            <Section4Assessment />
          </div>
        </div>

        {/* RIGHT: AI assistant and analysis panels */}
        <aside className="order-first space-y-5 lg:order-none lg:sticky lg:top-6">
          <AIAssistantPanel />
          <RiskAssessmentPanel />
          <CompletenessPanel />
          <DuplicatePanel />
        </aside>
      </div>
    </div>
  );
}