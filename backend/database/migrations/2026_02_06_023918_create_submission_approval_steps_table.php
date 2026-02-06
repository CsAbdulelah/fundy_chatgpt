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
        Schema::create('submission_approval_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('kyc_submissions')->cascadeOnDelete();
            $table->foreignId('step_id')->constrained('approval_steps')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->timestamp('acted_at')->nullable();
            $table->timestamps();

            $table->unique(['submission_id', 'step_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submission_approval_steps');
    }
};
