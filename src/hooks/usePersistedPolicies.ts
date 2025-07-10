const deletePolicy = async (policyId: string): Promise<boolean> => {
  setIsLoading(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Usuário não autenticado');

    // Invoca a Edge Function pelo SDK
    const { data, error } = await supabase
      .functions
      .invoke('delete-policy-pdf', { 
        body: JSON.stringify({ policyId }) 
      });
    if (error) throw error;

    // (Opcional) remova também o registro da tabela, se a function não fizer isso
    await supabase
      .from('policies')
      .delete()
      .eq('id', policyId);

    removePolicy(policyId);
    toast({
      title: "✅ Apólice Deletada",
      description: "Servidor e bucket limpos com sucesso",
    });
    
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao deletar apólice';
    console.error('❌ deletePolicy:', err);
    toast({
      title: "❌ Erro ao Deletar",
      description: message,
      variant: "destructive",
    });
    return false;
  } finally {
    setIsLoading(false);
  }
};
