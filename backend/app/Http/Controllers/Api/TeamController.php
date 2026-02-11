<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    private function ensureDemoTeam(): void
    {
        if (Team::query()->exists()) {
            return;
        }

        $user = \App\Models\User::query()->first();
        if (! $user) {
            $user = \App\Models\User::query()->create([
                'name' => 'GP Admin',
                'email' => 'gp@example.com',
                'password' => 'password',
            ]);
        }

        $team = Team::query()->create([
            'name' => 'GP Team',
            'owner_user_id' => $user->id,
            'timezone' => 'Asia/Riyadh',
            'default_language' => 'ar',
        ]);

        \App\Models\TeamMember::query()->create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role_name' => 'gp_admin',
            'permissions' => ['templates' => true, 'review' => true],
        ]);
    }

    public function index()
    {
        $this->ensureDemoTeam();
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
