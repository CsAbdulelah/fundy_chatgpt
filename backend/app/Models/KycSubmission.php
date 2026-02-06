<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KycSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'investor_user_id',
        'status',
        'revision',
        'data',
        'submitted_at',
        'approved_at',
        'locked_at',
    ];

    protected $casts = [
        'data' => 'array',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    public function template()
    {
        return $this->belongsTo(KycTemplate::class, 'template_id');
    }

    public function investor()
    {
        return $this->belongsTo(User::class, 'investor_user_id');
    }

    public function comments()
    {
        return $this->hasMany(KycComment::class, 'submission_id');
    }

    public function approvalActions()
    {
        return $this->hasMany(ApprovalAction::class, 'submission_id');
    }

    public function approvalSteps()
    {
        return $this->hasMany(SubmissionApprovalStep::class, 'submission_id');
    }
}
