<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'chain_id',
        'order_index',
        'approver_user_id',
    ];

    public function chain()
    {
        return $this->belongsTo(ApprovalChain::class, 'chain_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }

    public function submissionSteps()
    {
        return $this->hasMany(SubmissionApprovalStep::class, 'step_id');
    }
}
