import fs from 'fs'
import {
  DomainEventBus,
  NoSuchRepo,
  LocalClones,
  RepoAlreadyExists,
  RepoId,
} from 'git-en-boite-core'
import { assertThat, defined, equalTo, hasProperty, promiseThat, rejected } from 'hamjest'
import { wasCalled } from 'hamjest-sinon'
import { dirSync } from 'tmp'
import { stubInterface } from 'ts-sinon'

import { InventoryOfReposOnDisk } from './inventory_of_repos_on_disk'
import { RepoPath } from './repo_path'

describe(InventoryOfReposOnDisk.name, () => {
  const repoId = RepoId.generate()
  const basePath = dirSync().name
  const localClones = stubInterface<LocalClones>()
  const domainEvents = stubInterface<DomainEventBus>()
  const inventory = new InventoryOfReposOnDisk(basePath, localClones, domainEvents)

  describe('creating new repos', () => {
    it('creates a new LocalClone in a directory', async () => {
      await inventory.create(repoId)
      assertThat(localClones.createNew, wasCalled())
    })

    it('returns a Repo', async () => {
      const repo = await inventory.create(repoId)
      assertThat(repo, defined())
      assertThat(repo, hasProperty('repoId', equalTo(repoId)))
    })

    context('when the repo already exists', () => {
      it('returns an error', async () => {
        const repoPath = RepoPath.for(basePath, repoId)
        fs.mkdirSync(repoPath.value, { recursive: true })
        await promiseThat(inventory.create(repoId), rejected(RepoAlreadyExists.forRepoId(repoId)))
      })
    })
  })

  describe('finding existing repos', () => {
    context('when a folder exists for the repo', () => {
      const repoPath = RepoPath.for(basePath, repoId)
      it('returns a Repo', async () => {
        fs.mkdirSync(repoPath.value, { recursive: true })

        const repo = await inventory.find(repoId)
        assertThat(repo, defined())
        assertThat(repo, hasProperty('repoId', equalTo(repoId)))
      })

      it('opens a LocalClone', async () => {
        fs.mkdirSync(repoPath.value, { recursive: true })
        await inventory.find(repoId)
        assertThat(localClones.openExisting, wasCalled())
      })
    })

    it('fails when the repo does not exist', async () => {
      const repoId = RepoId.generate()
      await promiseThat(inventory.find(repoId), rejected(NoSuchRepo.forRepoId(repoId)))
    })
  })

  describe('checking if a repo exists', () => {
    it('returns true if a folder exists for the repo')
  })
})
