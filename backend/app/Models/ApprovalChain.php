<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalChain extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'template_id',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    public function template()
    {
        return $this->belongsTo(KycTemplate::class, 'template_id');
    }

    public function steps()
    {
        return $this->hasMany(ApprovalStep::class, 'chain_id')->orderBy('order_index');
    }
}
