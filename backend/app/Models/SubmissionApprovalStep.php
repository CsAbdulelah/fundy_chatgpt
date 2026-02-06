<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubmissionApprovalStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'step_id',
        'status',
        'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    public function submission()
    {
        return $this->belongsTo(KycSubmission::class, 'submission_id');
    }

    public function step()
    {
        return $this->belongsTo(ApprovalStep::class, 'step_id');
    }
}
