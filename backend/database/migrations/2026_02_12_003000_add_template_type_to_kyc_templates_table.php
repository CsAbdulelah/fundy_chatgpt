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
        Schema::table('kyc_templates', function (Blueprint $table) {
            $table->string('template_type')->default('individual')->after('default_language');
            $table->index(['team_id', 'template_type'], 'kyc_templates_team_type_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kyc_templates', function (Blueprint $table) {
            $table->dropIndex('kyc_templates_team_type_idx');
            $table->dropColumn('template_type');
        });
    }
};
