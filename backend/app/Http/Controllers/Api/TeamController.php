<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        return Team::with('members.user')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_user_id' => ['required', 'exists:users,id'],
            'timezone' => ['nullable', 'string'],
            'default_language' => ['nullable', 'string'],
            'branding' => ['nullable', 'array'],
        ]);

        $team = Team::create($data);

        return response()->json($team, 201);
    }

    public function show(Team $team)
    {
        return $team->load('members.user');
    }

    public function update(Request $request, Team $team)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'timezone' => ['nullable', 'string'],
            'default_language' => ['nullable', 'string'],
            'branding' => ['nullable', 'array'],
        ]);

        $team->update($data);

        return $team->fresh();
    }
}
