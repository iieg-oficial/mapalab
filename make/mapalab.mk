.PHONY: setup-hooks refresh-layer-tree

##@ MapaLab

setup-hooks: ## Configurar los git hooks del proyecto
	@$(LIB)
	git config core.hooksPath .githooks

refresh-layer-tree: ## Regenerar el cache del arbol de capas
	@$(LIB)
	env=$$(resolve_env)
	if [ -z "$$env" ]; then nothing_running 'REFRESH'; exit 0; fi
	banner 'REFRESH' "layer tree · $$env"
	refresh_layer_tree "$$env"
	rule
	printf '\n'
