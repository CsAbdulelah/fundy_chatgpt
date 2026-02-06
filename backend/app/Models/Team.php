<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_user_id',
        'timezone',
        'default_language',
        'branding',
    ];

    protected $casts = [
        'branding' => 'array',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function members()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function templates()
    {
        return $this->hasMany(KycTemplate::class);
    }

    public function approvalChains()
    {
        return $this->hasMany(ApprovalChain::class);
    }
}
