
import { supabase } from './supabase';
import { Company, Project, Worker } from '../types';

export const dataService = {
    // Companies
    async getCompanies() {
        const { data, error } = await supabase.from('companies').select('*');
        if (error) throw error;
        return data;
    },
    async createCompany(company: Partial<Company>) {
        const { data, error } = await supabase.from('companies').insert(company).select().single();
        if (error) throw error;
        return data;
    },

    // Projects
    async getProjects() {
        const { data, error } = await supabase.from('projects').select('*');
        if (error) throw error;
        return data;
    },
    async createProject(project: Partial<Project>) {
        const { data, error } = await supabase.from('projects').insert(project).select().single();
        if (error) throw error;
        return data;
    },

    // Workers
    async getWorkers() {
        const { data, error } = await supabase.from('workers').select('*');
        if (error) throw error;
        return data;
    },
    async createWorker(worker: Partial<Worker>) {
        // Note: You'd need to handle the JSON fields and related tables (dependents, experience)
        const { data, error } = await supabase.from('workers').insert(worker).select().single();
        if (error) throw error;
        return data;
    }
};
