<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KycInvite;
use Illuminate\Http\Request;

class InviteController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
        ]);

        return KycInvite::where('team_id', $request->input('team_id'))
            ->with(['investor', 'template'])
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'template_id' => ['required', 'exists:kyc_templates,id'],
            'investor_user_id' => ['required', 'exists:users,id'],
            'invited_by' => ['required', 'exists:users,id'],
            'status' => ['nullable', 'string'],
            'metadata' => ['nullable', 'array'],
        ]);

        $invite = KycInvite::create([
            'team_id' => $data['team_id'],
            'template_id' => $data['template_id'],
            'investor_user_id' => $data['investor_user_id'],
            'invited_by' => $data['invited_by'],
            'status' => $data['status'] ?? 'invited',
            'metadata' => $data['metadata'] ?? null,
        ]);

        return response()->json($invite, 201);
    }
}
