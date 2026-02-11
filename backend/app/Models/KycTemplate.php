<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KycTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'name',
        'description',
        'default_language',
        'template_type',
        'is_active',
        'schema',
        'branding',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'schema' => 'array',
        'branding' => 'array',
        'is_active' => 'boolean',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function invites()
    {
        return $this->hasMany(KycInvite::class, 'template_id');
    }

    public function submissions()
    {
        return $this->hasMany(KycSubmission::class, 'template_id');
    }

    public function approvalChains()
    {
        return $this->hasMany(ApprovalChain::class, 'template_id');
    }
}
