<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\ApprovalChain;
use App\Models\ApprovalStep;
use App\Models\KycSubmission;
use App\Models\SubmissionApprovalStep;
use Illuminate\Http\Request;

class ApprovalChainController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'template_id' => ['required', 'exists:kyc_templates,id'],
            'name' => ['required', 'string', 'max:255'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.approver_user_id' => ['required', 'exists:users,id'],
        ]);

        $chain = ApprovalChain::create([
            'team_id' => $data['team_id'],
            'template_id' => $data['template_id'],
            'name' => $data['name'],
            'is_active' => true,
        ]);

        foreach ($data['steps'] as $index => $step) {
            ApprovalStep::create([
                'chain_id' => $chain->id,
                'order_index' => $index + 1,
                'approver_user_id' => $step['approver_user_id'],
            ]);
        }

        return response()->json($chain->load('steps'), 201);
    }

    public function update(Request $request, ApprovalChain $chain)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'steps' => ['nullable', 'array', 'min:1'],
            'steps.*.approver_user_id' => ['required_with:steps', 'exists:users,id'],
        ]);

        $chain->update([
            'name' => $data['name'] ?? $chain->name,
            'is_active' => $data['is_active'] ?? $chain->is_active,
        ]);

        if (array_key_exists('steps', $data)) {
            $chain->steps()->delete();
            foreach ($data['steps'] as $index => $step) {
                ApprovalStep::create([
                    'chain_id' => $chain->id,
                    'order_index' => $index + 1,
                    'approver_user_id' => $step['approver_user_id'],
                ]);
            }
        }

        return $chain->load('steps');
    }

    public function startSubmission(Request $request, KycSubmission $submission)
    {
        $data = $request->validate([
            'chain_id' => ['required', 'exists:approval_chains,id'],
        ]);

        $chain = ApprovalChain::with('steps')->findOrFail($data['chain_id']);

        $submission->approvalSteps()->delete();

        foreach ($chain->steps as $index => $step) {
            SubmissionApprovalStep::create([
                'submission_id' => $submission->id,
                'step_id' => $step->id,
                'status' => $index === 0 ? 'pending' : 'locked',
            ]);
        }

        return $submission->load('approvalSteps.step');
    }

    public function actOnStep(Request $request, KycSubmission $submission)
    {
        $data = $request->validate([
            'step_id' => ['required', 'exists:approval_steps,id'],
            'actor_id' => ['required', 'exists:users,id'],
            'action' => ['required', 'in:approve,reject'],
            'comment' => ['nullable', 'string'],
        ]);

        $submissionStep = SubmissionApprovalStep::where('submission_id', $submission->id)
            ->where('step_id', $data['step_id'])
            ->firstOrFail();

        if ($submissionStep->status === 'locked') {
            return response()->json(['message' => 'Step is locked'], 409);
        }

        $submissionStep->update([
            'status' => $data['action'] === 'approve' ? 'approved' : 'rejected',
            'acted_at' => now(),
        ]);

        ApprovalAction::create([
            'submission_id' => $submission->id,
            'step_id' => $data['step_id'],
            'acted_by' => $data['actor_id'],
            'action' => $data['action'],
            'comment' => $data['comment'] ?? null,
            'acted_at' => now(),
        ]);

        if ($data['action'] === 'approve') {
            $currentStep = $submissionStep->step()->first();
            $nextStep = $currentStep
                ? ApprovalStep::where('chain_id', $currentStep->chain_id)
                    ->where('order_index', $currentStep->order_index + 1)
                    ->first()
                : null;
            $next = $nextStep
                ? SubmissionApprovalStep::where('submission_id', $submission->id)
                    ->where('step_id', $nextStep->id)
                    ->first()
                : null;
            if ($next) {
                $next->update(['status' => 'pending']);
            } else {
                $submission->update([
                    'status' => 'locked',
                    'locked_at' => now(),
                ]);
            }
        } else {
            $submission->update([
                'status' => 'changes_requested',
            ]);
        }

        return $submission->load('approvalSteps.step', 'approvalActions');
    }
}
