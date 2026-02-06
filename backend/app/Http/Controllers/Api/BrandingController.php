<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BrandingController extends Controller
{
    public function upload(Request $request)
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:5120'],
            'type' => ['required', 'in:logo,font'],
        ]);

        $path = $request->file('file')->store('branding');
        $absolute = Storage::path($path);

        return response()->json([
            'path' => $absolute,
            'type' => $data['type'],
        ]);
    }
}
