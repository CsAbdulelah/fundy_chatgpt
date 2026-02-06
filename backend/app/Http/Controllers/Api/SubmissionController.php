<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KycInvite;
use App\Models\KycSubmission;
use App\Services\PdfRenderer;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'template_id' => ['nullable', 'exists:kyc_templates,id'],
            'investor_user_id' => ['nullable', 'exists:users,id'],
        ]);

        $query = KycSubmission::query();

        if ($request->filled('template_id')) {
            $query->where('template_id', $request->input('template_id'));
        }

        if ($request->filled('investor_user_id')) {
            $query->where('investor_user_id', $request->input('investor_user_id'));
        }

        return $query->with('comments')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'template_id' => ['required', 'exists:kyc_templates,id'],
            'investor_user_id' => ['required', 'exists:users,id'],
            'data' => ['nullable', 'array'],
        ]);

        $submission = KycSubmission::create([
            'template_id' => $data['template_id'],
            'investor_user_id' => $data['investor_user_id'],
            'status' => 'draft',
            'data' => $data['data'] ?? null,
        ]);

        return response()->json($submission, 201);
    }

    public function update(Request $request, KycSubmission $submission)
    {
        $data = $request->validate([
            'data' => ['required', 'array'],
        ]);

        $submission->update([
            'data' => $data['data'],
        ]);

        return $submission->fresh();
    }

    public function submit(Request $request, KycSubmission $submission)
    {
        $submission->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        if ($request->filled('invite_id')) {
            KycInvite::where('id', $request->input('invite_id'))
                ->update([
                    'status' => 'submitted',
                    'current_submission_id' => $submission->id,
                ]);
        }

        return $submission->fresh();
    }

    public function resubmit(KycSubmission $submission)
    {
        $submission->update([
            'status' => 'submitted',
            'revision' => $submission->revision + 1,
            'submitted_at' => now(),
        ]);

        return $submission->fresh();
    }

    public function pdf(Request $request, KycSubmission $submission, PdfRenderer $renderer)
    {
        $language = $request->query('language');
        $path = $renderer->renderSubmission($submission, $language);

        return response()->download($path, 'submission-' . $submission->id . '.pdf');
    }
}
