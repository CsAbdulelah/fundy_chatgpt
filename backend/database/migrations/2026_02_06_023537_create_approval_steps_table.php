<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chain_id')->constrained('approval_chains')->cascadeOnDelete();
            $table->unsignedInteger('order_index');
            $table->foreignId('approver_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['chain_id', 'order_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
