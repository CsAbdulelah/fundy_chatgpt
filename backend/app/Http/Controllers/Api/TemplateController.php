<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KycTemplate;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    public function defaultSchema()
    {
        return config('kyc.default_schema');
    }

    public function index(Request $request)
    {
        $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
        ]);

        return KycTemplate::where('team_id', $request->input('team_id'))->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_language' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'schema' => ['required', 'array'],
            'branding' => ['nullable', 'array'],
            'actor_id' => ['required', 'exists:users,id'],
        ]);

        $template = KycTemplate::create([
            'team_id' => $data['team_id'],
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'default_language' => $data['default_language'] ?? 'ar',
            'is_active' => $data['is_active'] ?? true,
            'schema' => $data['schema'],
            'branding' => $data['branding'] ?? null,
            'created_by' => $data['actor_id'],
            'updated_by' => $data['actor_id'],
        ]);

        return response()->json($template, 201);
    }

    public function show(KycTemplate $template)
    {
        return $template->load('approvalChains.steps');
    }

    public function update(Request $request, KycTemplate $template)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_language' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'schema' => ['nullable', 'array'],
            'branding' => ['nullable', 'array'],
            'actor_id' => ['required', 'exists:users,id'],
        ]);

        $update = $data;
        unset($update['actor_id']);
        $update['updated_by'] = $data['actor_id'];

        $template->update($update);

        return $template->fresh();
    }
}
