<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KycComment;
use App\Models\KycSubmission;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function reject(Request $request, KycSubmission $submission)
    {
        $data = $request->validate([
            'reviewer_user_id' => ['required', 'exists:users,id'],
            'comments' => ['required', 'array'],
            'comments.*.section_key' => ['nullable', 'string'],
            'comments.*.field_key' => ['nullable', 'string'],
            'comments.*.comment' => ['required', 'string'],
        ]);

        foreach ($data['comments'] as $comment) {
            KycComment::create([
                'submission_id' => $submission->id,
                'reviewer_user_id' => $data['reviewer_user_id'],
                'section_key' => $comment['section_key'] ?? null,
                'field_key' => $comment['field_key'] ?? null,
                'comment' => $comment['comment'],
            ]);
        }

        $submission->update([
            'status' => 'changes_requested',
        ]);

        return $submission->load('comments');
    }

    public function approve(KycSubmission $submission)
    {
        $submission->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        return $submission->fresh();
    }
}
