<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KycInvite extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'template_id',
        'investor_user_id',
        'invited_by',
        'current_submission_id',
        'status',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function template()
    {
        return $this->belongsTo(KycTemplate::class, 'template_id');
    }

    public function investor()
    {
        return $this->belongsTo(User::class, 'investor_user_id');
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
