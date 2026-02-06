<?php

use App\Http\Controllers\Api\ApprovalChainController;
use App\Http\Controllers\Api\BrandingController;
use App\Http\Controllers\Api\InviteController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\TemplateController;
use Illuminate\Support\Facades\Route;

Route::prefix('teams')->group(function () {
    Route::get('/', [TeamController::class, 'index']);
    Route::post('/', [TeamController::class, 'store']);
    Route::get('{team}', [TeamController::class, 'show']);
    Route::patch('{team}', [TeamController::class, 'update']);
});

Route::prefix('templates')->group(function () {
    Route::get('default-schema', [TemplateController::class, 'defaultSchema']);
    Route::get('/', [TemplateController::class, 'index']);
    Route::post('/', [TemplateController::class, 'store']);
    Route::get('{template}', [TemplateController::class, 'show']);
    Route::patch('{template}', [TemplateController::class, 'update']);
});

Route::prefix('invites')->group(function () {
    Route::get('/', [InviteController::class, 'index']);
    Route::post('/', [InviteController::class, 'store']);
});

Route::prefix('submissions')->group(function () {
    Route::get('/', [SubmissionController::class, 'index']);
    Route::post('/', [SubmissionController::class, 'store']);
    Route::patch('{submission}', [SubmissionController::class, 'update']);
    Route::post('{submission}/submit', [SubmissionController::class, 'submit']);
    Route::post('{submission}/resubmit', [SubmissionController::class, 'resubmit']);
    Route::post('{submission}/reject', [ReviewController::class, 'reject']);
    Route::post('{submission}/approve', [ReviewController::class, 'approve']);
    Route::get('{submission}/pdf', [SubmissionController::class, 'pdf']);
});

Route::prefix('approval-chains')->group(function () {
    Route::post('/', [ApprovalChainController::class, 'store']);
    Route::patch('{chain}', [ApprovalChainController::class, 'update']);
    Route::post('{submission}/start', [ApprovalChainController::class, 'startSubmission']);
    Route::post('{submission}/action', [ApprovalChainController::class, 'actOnStep']);
});

Route::post('branding/upload', [BrandingController::class, 'upload']);
