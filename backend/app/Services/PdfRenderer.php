<?php

namespace App\Services;

use App\Models\KycSubmission;
use Symfony\Component\Process\Process;

class PdfRenderer
{
    public function renderSubmission(KycSubmission $submission, ?string $languageOverride = null): string
    {
        $submission->load(['template.team', 'investor']);

        $branding = array_merge(
            $submission->template?->team?->branding ?? [],
            $submission->template?->branding ?? []
        );

        $language = $languageOverride ?? $branding['pdf_language'] ?? $submission->template?->default_language ?? 'en';

        $payload = [
            'submission_id' => $submission->id,
            'investor_name' => $submission->investor?->name ?? 'Investor',
            'template_name' => $submission->template?->name ?? 'KYC Template',
            'generated_at' => now()->toDateTimeString(),
            'schema' => $submission->template?->schema ?? [],
            'data' => $submission->data ?? [],
            'language' => $language,
            'branding' => $branding,
        ];

        $tmpDir = storage_path('app/tmp');
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0775, true);
        }

        $jsonPath = $tmpDir . '/submission-' . $submission->id . '.json';
        file_put_contents($jsonPath, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        $pdfDir = storage_path('app/pdfs');
        if (!is_dir($pdfDir)) {
            mkdir($pdfDir, 0775, true);
        }

        $pdfPath = $pdfDir . '/submission-' . $submission->id . '.pdf';

        $python = base_path('.venv/bin/python');
        $script = base_path('scripts/render_pdf.py');

        $process = new Process([$python, $script, $jsonPath, $pdfPath]);
        $process->setTimeout(30);
        $process->mustRun();

        return $pdfPath;
    }
}
