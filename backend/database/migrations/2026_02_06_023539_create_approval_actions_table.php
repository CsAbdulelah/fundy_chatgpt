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
        Schema::create('approval_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('kyc_submissions')->cascadeOnDelete();
            $table->foreignId('step_id')->constrained('approval_steps')->cascadeOnDelete();
            $table->foreignId('acted_by')->constrained('users')->cascadeOnDelete();
            $table->string('action');
            $table->text('comment')->nullable();
            $table->timestamp('acted_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_actions');
    }
};
