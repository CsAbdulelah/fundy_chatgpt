<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KycComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'reviewer_user_id',
        'section_key',
        'field_key',
        'comment',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function submission()
    {
        return $this->belongsTo(KycSubmission::class, 'submission_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_user_id');
    }
}
