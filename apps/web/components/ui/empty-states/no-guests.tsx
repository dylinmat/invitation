"use client";

import { motion } from "framer-motion";
import { Users, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoGuestsProps {
  onAddGuest?: () => void;
  onImport?: () => void;
}

export function NoGuests({ onAddGuest, onImport }: NoGuestsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 px-6"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-[#E8D5D0] to-[#FDF8F5] rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Users className="w-10 h-10 text-[#8B6B5D]" />
      </div>
      
      <h3 className="text-xl font-semibold text-[#2C1810] mb-2">
        No guests yet
      </h3>
      
      <p className="text-muted-foreground max-w-sm mx-auto mb-8">
        Start building your guest list by adding guests manually or importing from a spreadsheet.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={onAddGuest}
          className="bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add First Guest
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onImport}
          className="border-[#E8D5D0]"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import from CSV
        </Button>
      </div>
    </motion.div>
  );
}
