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
            'template_type' => ['nullable', 'in:individual,institutional'],
        ]);

        $query = KycTemplate::where('team_id', $request->input('team_id'));

        if ($request->filled('template_type')) {
            $query->where('template_type', $request->input('template_type'));
        }

        return $query->orderByDesc('updated_at')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'team_id' => ['required', 'exists:teams,id'],
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_language' => ['nullable', 'string'],
            'template_type' => ['nullable', 'in:individual,institutional'],
            'is_active' => ['nullable', 'boolean'],
            'schema' => ['required', 'array'],
            'branding' => ['nullable', 'array'],
            'actor_id' => ['required', 'exists:users,id'],
        ]);

        $template = KycTemplate::create([
            'team_id' => $data['team_id'],
            'name' => $data['name'],
            'name_ar' => $data['name_ar'] ?? null,
            'description' => $data['description'] ?? null,
            'default_language' => $data['default_language'] ?? 'ar',
            'template_type' => $data['template_type'] ?? 'individual',
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
            'name_ar' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'default_language' => ['nullable', 'string'],
            'template_type' => ['nullable', 'in:individual,institutional'],
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
